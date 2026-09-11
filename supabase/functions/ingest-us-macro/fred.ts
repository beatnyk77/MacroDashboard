// deno-lint-ignore-file no-explicit-any
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { SupabaseClient } from '@supabase/supabase-js';

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, taskName: string): Promise<T> {
  let timeoutId: any;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${taskName} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
  try {
    const result = await Promise.race([promise, timeoutPromise]);
    return result;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

async function fetchWithRetry(url: string, options: RequestInit = {}, maxRetries = 2): Promise<Response> {
  let lastError: Error | null = null;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      if (i > 0) {
        const delay = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      const response = await fetch(url, options);
      if (response.ok) return response;

      const errorText = await response.text();
      if (response.status === 400 || response.status === 403 || response.status === 401) {
        throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 100)}`);
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error: any) {
      lastError = error;
    }
  }
  throw lastError || new Error(`Failed to fetch ${url}`);
}

export async function processFred(supabase: SupabaseClient, fredApiKey: string) {
    try {
        const startTime = Date.now();
        // 25 minute budget — stays under the 28 minute global safety timeout in runIngestion.
        // The old 50s budget was cutting off after ~10 batches, leaving most metrics unprocessed.
        const runtimeBudget = 25 * 60 * 1000;

        const { data: source } = await supabase.from('data_sources').select('id').eq('name', 'FRED').single();
        if (!source) throw new Error('FRED source not found');

        const { data: metrics } = await supabase
            .from('metrics')
            .select('id, metadata, updated_at')
            .eq('source_id', source.id)
            .eq('is_active', true)
            .order('updated_at', { ascending: true, nullsFirst: true });

        const targetMetrics = metrics?.filter((m: any) => (m.metadata as any)?.fred_id) || [];

        let successCount = 0;
        let totalRows = 0;
        const processedMetrics = [];
        const errors = [];
        const batchSize = 10; 

        for (let i = 0; i < targetMetrics.length; i += batchSize) {
            if (Date.now() - startTime > runtimeBudget) {
                console.log('Runtime budget exceeded, stopping early');
                break;
            }

            const batch = targetMetrics.slice(i, i + batchSize);
            const resultsArray = await Promise.all(batch.map(async (metric: any) => {
                const fredId = (metric.metadata as any).fred_id;

                if (metric.id === 'SOFR_OIS_SPREAD') {
                    try {
                        const [sofrRes, effrRes] = await Promise.all([
                            withTimeout(fetchWithRetry(`https://api.stlouisfed.org/fred/series/observations?series_id=SOFR&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=100`), 10000, 'SOFR Fetch'),
                            withTimeout(fetchWithRetry(`https://api.stlouisfed.org/fred/series/observations?series_id=EFFR&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=100`), 10000, 'EFFR Fetch')
                        ]);

                        const sofrData = await sofrRes.json() as any;
                        const effrData = await effrRes.json() as any;
                        
                        const sofrObs = sofrData.observations || [];
                        const effrObs = effrData.observations || [];
                        const effrMap = new Map(effrObs.map((o: any) => [o.date, parseFloat(o.value)]));

                        const spreadObservations = sofrObs
                            .map((s: any) => {
                                const sofrVal = parseFloat(s.value);
                                const effrVal = effrMap.get(s.date);
                                if (isNaN(sofrVal) || effrVal === undefined || isNaN(effrVal as number)) return null;
                                return {
                                    metric_id: 'SOFR_OIS_SPREAD',
                                    as_of_date: s.date,
                                    value: Math.round((sofrVal - (effrVal as number)) * 100),
                                    last_updated_at: new Date().toISOString(),
                                    provenance: 'api_live'
                                };
                            })
                            .filter((o: any) => o !== null);

                        if (spreadObservations.length > 0) {
                            const { error: upsertError } = await supabase.from('metric_observations').upsert(spreadObservations, { onConflict: 'metric_id, as_of_date' });
                            if (upsertError) throw upsertError;
                            await supabase.from('metrics').update({ updated_at: new Date().toISOString() }).eq('id', 'SOFR_OIS_SPREAD');
                            return { metricId: 'SOFR_OIS_SPREAD', count: spreadObservations.length, success: true };
                        }
                        return { metricId: 'SOFR_OIS_SPREAD', count: 0, success: true };
                    } catch (err: any) {
                        return { metricId: 'SOFR_OIS_SPREAD', count: 0, success: false, error: err.message };
                    }
                }

                const fredUnits = (metric.metadata as any)?.fred_units;
                const unitsParam = fredUnits ? `&units=${fredUnits}` : '';
                const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${fredId}&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=2000${unitsParam}`;

                try {
                    const response = await withTimeout(fetchWithRetry(url), 10000, `FRED Fetch ${fredId}`);
                    const data = await response.json() as any;
                    
                    if (!data.observations) return { metricId: metric.id, count: 0, success: false, error: 'No observations' };

                    const observations = data.observations
                        .map((obs: any) => ({
                            metric_id: metric.id,
                            as_of_date: obs.date,
                            value: parseFloat(obs.value),
                            last_updated_at: new Date().toISOString(),
                            provenance: 'api_live'
                        }))
                        .filter((obs: any) => !isNaN(obs.value));

                    if (observations.length > 0) {
                        const { error: upsertError } = await supabase.from('metric_observations').upsert(observations, { onConflict: 'metric_id, as_of_date' });
                        if (upsertError) throw upsertError;
                        await supabase.from('metrics').update({ updated_at: new Date().toISOString() }).eq('id', metric.id);
                        return { metricId: metric.id, count: observations.length, success: true };
                    }
                    await supabase.from('metrics').update({ updated_at: new Date().toISOString() }).eq('id', metric.id);
                    return { metricId: metric.id, count: 0, success: true };
                } catch (err: any) {
                    await supabase.from('metrics').update({ updated_at: new Date().toISOString() }).eq('id', metric.id);
                    return { metricId: metric.id, count: 0, success: false, error: err.message };
                }
            }));

            for (const res of resultsArray) {
                if (res.success) {
                    successCount++;
                    processedMetrics.push(res.metricId);
                    totalRows += res.count;
                } else {
                    errors.push({ metric: res.metricId, error: res.error });
                }
            }
        }

        // Ingest Desk A: Interbank Credit & Funding Stress metrics & composite
        try {
            const deskARows = await ingestDeskAInterbankMetrics(supabase, fredApiKey);
            totalRows += deskARows;
        } catch (deskAErr: any) {
            console.error('Error ingesting Desk A Interbank metrics:', deskAErr.message);
        }

        return { success: true, count: totalRows, details: { attempted: targetMetrics.length, successful: successCount, errors } };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

async function ingestDeskAInterbankMetrics(supabase: SupabaseClient, fredApiKey: string): Promise<number> {
    const series = [
        { id: 'US_SRF_UTILIZATION_BN', fredId: 'WORAL' },
        { id: 'US_BANK_CREDIT_H8_YOY', fredId: 'BUSLOANS' },
        { id: 'US_HY_CREDIT_OAS_BPS', fredId: 'BAMLH0A0HYM2' },
    ];

    let totalRows = 0;
    let latestHyOas = 380;
    const latestSofrSpread = 3;
    let latestBankCredit = 8.6;

    for (const s of series) {
        try {
            const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${s.fredId}&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=60`;
            const res = await withTimeout(fetchWithRetry(url), 10000, `FRED ${s.id}`);
            const data = await res.json() as any;
            if (data.observations && data.observations.length > 0) {
                const observations = data.observations
                    .map((obs: any, idx: number) => {
                        const val = parseFloat(obs.value);
                        if (isNaN(val)) return null;
                        let finalVal = val;
                        let sourceRef = `FRED: ${s.fredId}`;

                        if (s.id === 'US_HY_CREDIT_OAS_BPS') {
                            finalVal = Math.round(val * 100); // % to bps
                        }
                        if (s.id === 'US_SRF_UTILIZATION_BN') {
                            finalVal = Math.round((val / 1000) * 10000) / 10000; // Millions to Billions
                            sourceRef = 'live_api:fred:WORAL';
                        }
                        if (s.id === 'US_BANK_CREDIT_H8_YOY') {
                            const prev12mObs = data.observations[idx + 12];
                            const prevVal = prev12mObs ? parseFloat(prev12mObs.value) : NaN;
                            if (isNaN(prevVal) || prevVal <= 0) return null;
                            finalVal = Math.round(((val - prevVal) / prevVal) * 10000) / 100; // 12M YoY %
                            sourceRef = 'FRED: BUSLOANS (12M % Change)';
                        }

                        return {
                            metric_id: s.id,
                            as_of_date: obs.date,
                            value: finalVal,
                            last_updated_at: new Date().toISOString(),
                            provenance: 'api_live',
                            source_ref: sourceRef
                        };
                    })
                    .filter((o: any) => o !== null);

                if (observations.length > 0) {
                    await supabase.from('metric_observations').upsert(observations, { onConflict: 'metric_id, as_of_date' });
                    totalRows += observations.length;
                    if (s.id === 'US_HY_CREDIT_OAS_BPS') latestHyOas = observations[0].value;
                    if (s.id === 'US_BANK_CREDIT_H8_YOY') latestBankCredit = observations[0].value;
                }
            }
        } catch (err: any) {
            console.error(`Desk A FRED fetch error for ${s.id}:`, err.message);
        }
    }

    // Compute composite INTERBANK_CREDIT_STRESS_INDEX (0 to 100)
    // Formula: normalized combination of HY OAS, SOFR spread, and Bank credit growth deceleration
    const stressScore = Math.min(100, Math.max(0, Math.round(
        ((latestHyOas - 300) / 5) + (latestSofrSpread * 2.5) + Math.max(0, 8 - latestBankCredit) * 3
    )));

    const today = new Date().toISOString().split('T')[0];
    const stressObs = [{
        metric_id: 'INTERBANK_CREDIT_STRESS_INDEX',
        as_of_date: today,
        value: stressScore,
        last_updated_at: new Date().toISOString(),
        provenance: 'api_live'
    }];

    await supabase.from('metric_observations').upsert(stressObs, { onConflict: 'metric_id, as_of_date' });
    totalRows += 1;

    return totalRows;
}

