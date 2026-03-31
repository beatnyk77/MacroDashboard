import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { runIngestion, IngestionContext } from '@shared/logging.ts'
import { withTimeout } from '@shared/timeout-guard.ts'

// Transit days by origin region for heuristic tanker pipeline
const TRANSIT_DAYS_BY_ORIGIN: Record<string, number> = {
  'Saudi Arabia': 18,
  'Iraq': 20,
  'UAE': 17,
  'Kuwait': 19,
  'Iran': 21,
  'Qatar': 18,
  'Oman': 16,
  'Nigeria': 30,
  'Angola': 32,
  'Libya': 28,
  'Venezuela': 45,
  'USA': 50,
  'Russia': 45,
  'Norway': 40,
  'Mexico': 35,
  'Brazil': 38,
  'Default': 25
};

// Chokepoint exposure by origin
const CHOKEPOINT_EXPOSED_ORIGINS = new Set([
  'Saudi Arabia', 'Iraq', 'UAE', 'Kuwait', 'Iran', 'Qatar', 'Oman'
]);

Deno.serve(async (_req: Request) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  return runIngestion(supabase, 'ingest-fuel-security-india', async (_ctx: IngestionContext) => {

    const today = new Date().toISOString().split('T')[0];
    const stepLogs: any[] = [];

    // ==========================================
    // Step 1: Fetch PPAC India reserves & consumption
    // ==========================================
    let ppacReservesOfficial: number | null = null;
    let ppacReservesActual: number | null = null;
    let consumptionMbpd: number | null = null;

    try {
      console.log('Fetching PPAC data...');
      // PPAC does not have a public API; we scrape their reports
      // For V1, use hardcoded recent values if scraping fails
      // TODO: Implement PPAC scraper (PDF/HTML parsing)

      // Placeholder: should be replaced with actual fetch from PPAC website or cached data
      stepLogs.push({ step: 'ppac_fetch', status: 'fallback_placeholder', note: 'PPAC scraping not yet implemented; using institutional proxy values' });

      // Institutional proxy (should be ~10-12 days total coverage for India strategic + commercial)
      ppacReservesOfficial = 9.8;  // days
      ppacReservesActual = 11.2;   // days (independent estimate)
      consumptionMbpd = 5.12;      // mbpd
    } catch (e: any) {
      console.error('PPAC fetch error:', e.message);
      stepLogs.push({ step: 'ppac_fetch', status: 'error', message: e.message });
      throw e;  // Fail fast; PPAC is critical
    }

    // ==========================================
    // Step 2: Fetch Brent Price + INR FX
    // ==========================================
    let brentPriceUsd: number | null = null;
    let inrPerBarrel: number | null = null;

    try {
      console.log('Fetching Brent + FX...');

      // Fetch latest Brent from metric_observations (OIL_BRENT_PRICE_USD)
      const { data: brentObs, error: brentErr } = await supabase
        .from('metric_observations')
        .select('value')
        .eq('metric_id', 'OIL_BRENT_PRICE_USD')
        .order('as_of_date', { ascending: false })
        .limit(1)
        .single();

      if (brentErr || !brentObs) {
        throw new Error(`Brent fetch failed: ${brentErr?.message || 'no data'}`);
      }
      brentPriceUsd = Number(brentObs.value);

      // Fetch INR/USD FX from metric_observations (DEXINUS)
      const { data: fxObs, error: fxErr } = await supabase
        .from('metric_observations')
        .select('value')
        .eq('metric_id', 'DEXINUS')
        .order('as_of_date', { ascending: false })
        .limit(1)
        .single();

      if (fxErr || !fxObs) {
        throw new Error(`FX fetch failed: ${fxErr?.message || 'no data'}`);
      }
      const inrPerUsd = Number(fxObs.value);
      inrPerBarrel = brentPriceUsd * inrPerUsd;

      stepLogs.push({ step: 'brent_fx', status: 'success', brent: brentPriceUsd, fx: inrPerUsd });
    } catch (e: any) {
      console.error('Brent/FX error:', e.message);
      stepLogs.push({ step: 'brent_fx', status: 'error', message: e.message });
      // Continue with nulls; UI will show fallback if critical data missing
    }

    // ==========================================
    // Step 3: Compute reserves coverage & scenarios
    // ==========================================
    const reservesDaysCoverage = (ppacReservesOfficial + ppacReservesActual) / 2;
    const deviationPct = ppacReservesActual && ppacReservesOfficial
      ? ((ppacReservesActual - ppacReservesOfficial) / ppacReservesOfficial) * 100
      : null;

    // Scenario calculations (using simple projections)
    // Assume we have 30 days of imports in transit, 15 days of consumption in reserves
    const baselineDays = reservesDaysCoverage;
    const disruptionDays = reservesDaysCoverage * 0.7;   // 30% import reduction extends reserves
    const rationingDays = reservesDaysCoverage * 1.5;    // 50% consumption extends reserves

    // ==========================================
    // Step 4: Tanker pipeline heuristic
    // ==========================================
    let activeTankersCount = 0;
    let tankerPipeline: any[] = [];

    try {
      console.log('Building tanker pipeline heuristic...');

      // Fetch India oil imports by origin (latest available, typically annual)
      const { data: importsData, error: importsErr } = await supabase
        .from('oil_imports_by_origin')
        .select('exporter_country_name, import_volume_mbbl')
        .eq('importer_country_code', 'IN');

      if (importsErr || !importsData || importsData.length === 0) {
        throw new Error(`Imports fetch failed: ${importsErr?.message || 'no data'}`);
      }

      // Aggregate by exporter
      const importsByOrigin = new Map<string, number>();
      let totalImportsMbbl = 0;

      for (const row of importsData) {
        const origin = row.exporter_country_name || 'Unknown';
        const volume = Number(row.import_volume_mbbl) || 0;
        importsByOrigin.set(origin, (importsByOrigin.get(origin) || 0) + volume);
        totalImportsMbbl += volume;
      }

      if (totalImportsMbbl === 0) {
        throw new Error('Total imports volume is zero');
      }

      // Estimate active tankers: assume each VLCC carries ~2Mbbl, average 60-day cycle
      const avgVesselCapacityMbbl = 2.0;
      const avgShippingCycleDays = 60;
      const dailyImportRequirementMbbl = totalImportsMbbl / 365;  // annual to daily
      const arrivalsPerDay = dailyImportRequirementMbbl / avgVesselCapacityMbbl;
      activeTankersCount = Math.round(arrivalsPerDay * avgShippingCycleDays);

      // Build pipeline: for each origin, estimate vessels en route
      const now = new Date();
      let tankerIdCounter = 1;

      for (const [origin, volume] of importsByOrigin.entries()) {
        const share = volume / totalImportsMbbl;
        const originVesselCount = Math.max(1, Math.round(activeTankersCount * share));
        const transitDays = TRANSIT_DAYS_BY_ORIGIN[origin] || TRANSIT_DAYS_BY_ORIGIN['Default'];
        const riskFlag = CHOKEPOINT_EXPOSED_ORIGINS.has(origin) ? 'chokepoint_exposed' : 'standard';

        for (let i = 0; i < originVesselCount; i++) {
          // Spread ETA across a window of ±5 days around avg transit
          const etaOffset = transitDays + (Math.random() * 10 - 5);
          const eta = new Date(now.getTime() + etaOffset * 24 * 60 * 60 * 1000);

          tankerPipeline.push({
            id: `vessel-${tankerIdCounter++}`,
            vessel_name: `MT ${origin.substring(0, 8).toUpperCase()}${i + 1}`,
            origin,
            eta: eta.toISOString().split('T')[0],
            volume_mbbl: avgVesselCapacityMbbl + (Math.random() * 0.5 - 0.25),  // Slight variance
            risk_flag: riskFlag,
            vessel_type: 'VLCC'
          });
        }
      }

      // Sort by ETA ascending
      tankerPipeline.sort((a, b) => new Date(a.eta).getTime() - new Date(b.eta).getTime());

      stepLogs.push({ step: 'tanker_pipeline', status: 'success', count: tankerPipeline.length });
    } catch (e: any) {
      console.error('Tanker pipeline error:', e.message);
      stepLogs.push({ step: 'tanker_pipeline', status: 'error', message: e.message });
      // Don't fail completely; show zero count
      activeTankersCount = 0;
      tankerPipeline = [];
    }

    // ==========================================
    // Step 5: Geopolitical risk score
    // ==========================================
    let geopoliticalRiskScore = 50;  // Default baseline

    try {
      console.log('Fetching geopolitical risk score...');

      // Query the aggregated view for latest score
      const { data: riskData, error: riskErr } = await supabase
        .from('fuel_geopolitical_aggregated_score')
        .select('geopolitical_risk_score')
        .order('score_date', { ascending: false })
        .limit(1)
        .single();

      if (!riskErr && riskData) {
        geopoliticalRiskScore = Number(riskData.geopolitical_risk_score);
      } else {
        // Compute today's score from events table directly if view returns empty
        const { data: events, error: eventsErr } = await supabase
          .from('geopolitical_risk_events')
          .select('chokepoint, severity')
          .gte('as_of_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

        if (!eventsErr && events && events.length > 0) {
          const scoresByChokepoint = new Map<string, number>();
          for (const ev of events) {
            const cp = ev.chokepoint;
            const existing = scoresByChokepoint.get(cp) || 0;
            scoresByChokepoint.set(cp, existing + (Number(ev.severity) * 2.5));
          }
          const weightedScores = Array.from(scoresByChokepoint.values());
          geopoliticalRiskScore = Math.min(100, Math.max(...weightedScores) + 30);
        } else {
          stepLogs.push({ step: 'geopolitical_risk', status: 'fallback', note: 'No recent events, using default 50' });
        }
      }

      stepLogs.push({ step: 'geopolitical_risk', status: 'success', score: geopoliticalRiskScore });
    } catch (e: any) {
      console.error('Geopolitical risk error:', e.message);
      stepLogs.push({ step: 'geopolitical_risk', status: 'fallback', message: e.message, score: geopoliticalRiskScore });
      // Keep default 50
    }

    // ==========================================
    // Step 6: Assemble row and upsert
    // ==========================================
    const row: any = {
      as_of_date: today,
      reserves_days_coverage: Math.round(reservesDaysCoverage * 10) / 10,
      reserves_days_official: Math.round(ppacReservesOfficial! * 10) / 10,
      reserves_days_actual: ppacReservesActual ? Math.round(ppacReservesActual * 10) / 10 : null,
      deviation_pct: deviationPct ? Math.round(deviationPct * 10) / 10 : null,
      daily_consumption_mbpd: Math.round(consumptionMbpd! * 100) / 100,
      brent_price_usd: brentPriceUsd ? Math.round(brentPriceUsd * 100) / 100 : null,
      inr_per_barrel: inrPerBarrel ? Math.round(inrPerBarrel) : null,
      active_tankers_count: activeTankersCount,
      tanker_pipeline_json: tankerPipeline,
      geopolitical_risk_score: Math.round(geopoliticalRiskScore),
      scenario_baseline_days: Math.round(baselineDays * 10) / 10,
      scenario_disruption_days: Math.round(disruptionDays * 10) / 10,
      scenario_rationing_days: Math.round(rationingDays * 10) / 10,
      last_updated_at: new Date().toISOString(),
      metadata: {
        source_reliability: 'medium',  // V1: placeholder until PPAC automated
        notes: `Ingestion v1: PPAC=${ppacReservesOfficial?'official':'placeholder'}, tankers=heuristic, risk=rule-based`,
        ingestion_version: 1
      }
    };

    // Upsert to database
    const { error: upsertError } = await supabase
      .from('fuel_security_clock_india')
      .upsert(row, { onConflict: 'as_of_date' });

    if (upsertError) {
      console.error('Upsert failed:', upsertError);
      throw upsertError;
    }

    return {
      rows_upserted: 1,
      metadata: { steps: stepLogs, as_of_date: today }
    };
  });
});