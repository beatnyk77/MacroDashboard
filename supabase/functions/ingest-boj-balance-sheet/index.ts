/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient } from '@supabase/supabase-js'
import { serveIngest, IngestResult } from '../_shared/handler.ts'
import { upsertObservations } from '../_shared/ingest_utils.ts'

async function fetchWithRetry(url: string, options: RequestInit = {}, maxRetries = 3): Promise<Response> {
    let lastError: Error | null = null;
    const defaultOptions = {
        ...options,
        headers: {
            ...options.headers,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Accept': 'application/json'
        }
    };
    for (let i = 0; i <= maxRetries; i++) {
        try {
            if (i > 0) {
                const delay = Math.pow(2, i) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
            const response = await fetch(url, defaultOptions);
            if (response.ok) return response;

            // Log body for debugging 400/403
            const text = await response.text();
            throw new Error(`HTTP ${response.status}: ${text.substring(0, 100)}`);
        } catch (error: any) {
            lastError = error;
            console.warn(`Attempt ${i + 1} failed for ${url}: ${error.message}`);
        }
    }
    throw lastError || new Error(`Failed to fetch ${url} after ${maxRetries} retries`);
}

async function doIngestBoj(supabase: any, fredApiKey: string): Promise<IngestResult> {
    // Metrics to fetch from FRED
    const metricsMap = [
        { id: 'BOJ_TOTAL_ASSETS_TRJPY', fredId: 'JPNASSETS' },
        { id: 'BOJ_MONETARY_BASE_TRJPY', fredId: 'JPNBASE' }
    ];

    const results: any[] = [];
    const errors: any[] = [];

    for (const item of metricsMap) {
        try {
            const fredUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=${item.fredId}&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=5`;

            const response = await fetchWithRetry(fredUrl);
            const data = await response.json();

            if (data.observations) {
                data.observations.forEach((obs: any) => {
                    const value = parseFloat(obs.value);
                    if (!isNaN(value)) {
                        // All these FRED series are in Millions of Yen.
                        // To get Trillions, divide by 1,000,000
                        results.push({
                            metric_id: item.id,
                            as_of_date: obs.date,
                            value: value / 1000000,
                            last_updated_at: new Date().toISOString()
                        });
                    }
                });
            }
        } catch (e: any) {
            console.error(`Error fetching ${item.id}:`, e);
            errors.push({ metric: item.id, error: e.message });
        }
    }

    let upserted = 0;
    if (results.length > 0) {
        const { count } = await upsertObservations(supabase, results, {
            source_ref: 'live_api:ingest-boj-balance-sheet',
            is_provisional: false,
        });
        upserted = count ?? 0;
    }

    return {
        ok: true,
        counts: { upserted, skipped: 0 },
        meta: {
            metrics_processed: metricsMap.map(m => m.id),
            errors
        }
    };
}

serveIngest('ingest-boj-balance-sheet', async (_req: Request): Promise<IngestResult> => {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    const fredApiKey = Deno.env.get('FRED_API_KEY') ?? ''
    if (!fredApiKey) throw new Error('FRED_API_KEY is missing')
    return doIngestBoj(supabase, fredApiKey)
}, { timeoutMs: 15 * 60 * 1000, retries: 3 })
