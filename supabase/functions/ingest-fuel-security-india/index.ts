import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { runIngestion, IngestionContext } from '../_shared/logging.ts'

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
    // Step 1: Fetch India oil consumption from EIA
    // ==========================================
    let consumptionMbpd: number | null = null;

    try {
      console.log('Fetching India oil consumption from EIA...');
      const eiaApiKey = Deno.env.get('EIA_API_KEY');
      if (!eiaApiKey) throw new Error('Missing EIA_API_KEY for India fuel security');

      // EIA International: India crude oil consumption (thousand barrels per day)
      // activityId=1 (Consumption), productId=5 (Crude Oil)
      const consumptionUrl = `https://api.eia.gov/v2/international/data/?api_key=${eiaApiKey}&frequency=annual&data[0]=value&facets[countryRegionId][]=IND&facets[activityId][]=1&facets[productId][]=5&sort[0][column]=period&sort[0][direction]=desc&length=1`;
      const consRes = await fetch(consumptionUrl);
      if (consRes.ok) {
        const json = await consRes.json() as any;
        const latest = json.response?.data?.[0];
        if (latest && latest.value) {
          consumptionMbpd = Number(latest.value); // Already in thousand bpd (mbpd)
          stepLogs.push({ step: 'india_consumption', status: 'success', value: consumptionMbpd });
        } else {
          throw new Error('No consumption data in EIA response');
        }
      } else {
        throw new Error(`EIA consumption fetch failed: ${consRes.status}`);
      }
    } catch (e: any) {
      console.error('India EIA consumption error:', e.message);
      stepLogs.push({ step: 'india_consumption', status: 'error', message: e.message });
      // Without consumption, we cannot compute coverage days; fail the ingestion
      throw new Error(`Cannot proceed without consumption data: ${e.message}`);
    }

    // ==========================================
    // Step 2: Estimate India strategic reserves (use known capacity)
    // ==========================================
    // India's SPR: Two facilities (Mangalore, Visakhapatnam) total ~5.3 million tonnes
    // Source: Public data from PPAC/International Energy Agency
    // Convert to barrels: 1 tonne crude ~ 7.3 barrels
    // 5.3M tonnes * 7.3 = ~38.7M barrels
    // Days of import coverage = (SPR volume mbbl) / (daily consumption mbbl) * (import share factor)
    // But SPR is typically measured in days of import dependence, not consumption.
    // Approx: India imports ~80-85% of its oil needs. SPR coverage in days of imports is ~9-10 days.
    // We'll use a conservative estimate based on known capacity and recent fill reports.

    // Known: India SPR capacity ~40M barrels, fill rate ~60-70% historically
    // But we want actual coverage days. If daily consumption ~5.1 mbpd, imports ~4.3 mbpd (85%).
    // SPR volume ~26M barrels (65% fill) -> coverage = 26/4.3 ~ 6 days.
    // PPAC official numbers often report lower; we'll derive from actual fill if possible.

    // Better: Use PPAC monthly reports if we can fetch them. For now, we lack a real-time API.
    // We'll attempt to fetch from a data source or use a fixed value from a reliable published source.

    // Since we cannot reliably scrape PPAC in this function (PDF parsing is heavy),
    // we will set reserves to null and the UI will show "Data not available" for official/actual splits.
    // We'll still compute tanker pipeline and INR/barrel.

    let reservesDaysOfficial: number | null = null;
    let reservesDaysActual: number | null = null;

    stepLogs.push({ step: 'india_reserves', status: 'unavailable', note: 'India SPR days-of-coverage requires PPAC integration; not available in this ingestion' });

    // ==========================================
    // Step 3: Fetch Brent Price + INR FX
    // ==========================================
    let brentPriceUsd: number | null = null;
    let inrPerBarrel: number | null = null;

    try {
      console.log('Fetching Brent + FX...');

      // Fetch latest Brent from metric_observations
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

      // Fetch INR/USD FX from metric_observations
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
      // Continue; UI will show null for currency cost
    }

    // ==========================================
    // Step 4: Compute reserves coverage (if we have reserves data)
    // ==========================================
    let reservesDaysCoverage: number | null = null;
    let deviationPct: number | null = null;

    if (reservesDaysOfficial !== null && reservesDaysActual !== null) {
      reservesDaysCoverage = (reservesDaysOfficial + reservesDaysActual) / 2;
      deviationPct = ((reservesDaysActual - reservesDaysOfficial) / reservesDaysOfficial) * 100;
    }

    // Scenario calculations (only if we have a baseline coverage)
    let scenarioBaselineDays: number = 0;
    let scenarioDisruptionDays: number = 0;
    let scenarioRationingDays: number = 0;

    if (reservesDaysCoverage !== null) {
      scenarioBaselineDays = reservesDaysCoverage;
      scenarioDisruptionDays = reservesDaysCoverage * 0.7;   // 30% import reduction extends reserves
      scenarioRationingDays = reservesDaysCoverage * 1.5;    // 50% consumption extends reserves
    } else {
      // Without reserves data, we cannot compute scenarios
      stepLogs.push({ step: 'scenarios', status: 'skipped', note: 'No reserves coverage data' });
    }

    // ==========================================
    // Step 5: Tanker pipeline heuristic
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
      const dailyImportRequirementMbbl = consumptionMbpd ? consumptionMbpd * 0.85 : totalImportsMbbl / 365; // if consumption known, imports ~85%
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
    // Step 6: Geopolitical risk score
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
    }

    // ==========================================
    // Step 7: Assemble row and upsert
    // ==========================================
    const row: any = {
      as_of_date: today,
      reserves_days_coverage: reservesDaysCoverage ? Math.round(reservesDaysCoverage * 10) / 10 : null,
      reserves_days_official: reservesDaysOfficial ? Math.round(reservesDaysOfficial * 10) / 10 : null,
      reserves_days_actual: reservesDaysActual ? Math.round(reservesDaysActual * 10) / 10 : null,
      deviation_pct: deviationPct ? Math.round(deviationPct * 10) / 10 : null,
      daily_consumption_mbpd: consumptionMbpd ? Math.round(consumptionMbpd * 100) / 100 : null,
      brent_price_usd: brentPriceUsd ? Math.round(brentPriceUsd * 100) / 100 : null,
      inr_per_barrel: inrPerBarrel ? Math.round(inrPerBarrel) : null,
      active_tankers_count: activeTankersCount,
      tanker_pipeline_json: tankerPipeline,
      geopolitical_risk_score: Math.round(geopoliticalRiskScore),
      scenario_baseline_days: scenarioBaselineDays ? Math.round(scenarioBaselineDays * 10) / 10 : null,
      scenario_disruption_days: scenarioDisruptionDays ? Math.round(scenarioDisruptionDays * 10) / 10 : null,
      scenario_rationing_days: scenarioRationingDays ? Math.round(scenarioRationingDays * 10) / 10 : null,
      last_updated_at: new Date().toISOString(),
      metadata: {
        source_reliability: consumptionMbpd ? 'high' : 'low',
        notes: `Ingestion: consumption=EIA, reserves=unavailable, tankers=heuristic, risk=rule-based`,
        ingestion_version: 2
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
