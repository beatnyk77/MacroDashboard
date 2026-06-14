/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient } from '@supabase/supabase-js'
import { serveIngest, IngestResult } from '../_shared/handler.ts'
import { upsertObservations } from '../_shared/ingest_utils.ts'

interface GfcfMetric {
    id: string;
    type: 'calculated' | 'direct';
    series_id?: string;
    numerator?: string;
    denominator?: string;
    denominator_candidates?: string[];
    numerator_scale?: number;
}

const METRICS: GfcfMetric[] = [
    {
        id: 'US_GFCF_GDP_PCT',
        type: 'calculated',
        numerator: 'GPDIC1',
        denominator: 'GDPC1',
        numerator_scale: 1
    },
    {
        id: 'US_PRIVATE_GFCF_GDP_PCT',
        type: 'direct',
        series_id: 'A006RE1Q156NBEA',
    },
    {
        id: 'JP_GFCF_GDP_PCT',
        type: 'calculated',
        numerator: 'NAEXKP04JPQ189S',
        denominator_candidates: ['JPNNGDP'],
        numerator_scale: 1000
    },
    {
        id: 'EU_GFCF_GDP_PCT',
        type: 'calculated',
        numerator: 'NAEXCP04EZQ189S',
        denominator: 'EUNNGDP',
        numerator_scale: 0.000001
    },
    {
        id: 'IN_GFCF_GDP_PCT',
        type: 'calculated',
        numerator: 'NAEXKP04INQ652S',
        denominator: 'INDGDPNQDSMEI',
        numerator_scale: 1
    }
];

const CHINA_GFCF_FIXED = 42.0;

async function fetchFredSeries(apiKey: string, seriesId: string) {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=1`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`FRED fetch failed for ${seriesId}: ${res.statusText}`);
    const data = await res.json();
    if (!data.observations || data.observations.length === 0) return null;
    return {
        date: data.observations[0].date,
        value: parseFloat(data.observations[0].value)
    };
}

async function doIngestGfcf(supabase: ReturnType<typeof createClient>, fredApiKey: string): Promise<IngestResult> {
    const updates: any[] = [];
    const errors: string[] = [];

    for (const metric of METRICS) {
        try {
            let value: number | null = null;
            let date: string | null = null;

            if (metric.type === 'direct' && metric.series_id) {
                const obs = await fetchFredSeries(fredApiKey, metric.series_id);
                if (obs) {
                    value = obs.value;
                    date = obs.date;
                }
            } else if (metric.type === 'calculated' && metric.numerator) {
                const num = await fetchFredSeries(fredApiKey, metric.numerator);

                let den = null;
                const candidates = metric.denominator_candidates || (metric.denominator ? [metric.denominator] : []);

                for (const cand of candidates) {
                    try {
                        den = await fetchFredSeries(fredApiKey, cand);
                        if (den) break;
                    } catch (e: any) {
                        console.log(`Candidate ${cand} failed: ${e.message}`);
                    }
                }

                if (num && den) {
                    const scale = metric.numerator_scale ?? 1;
                    const scaledNum = num.value * scale;
                    value = (scaledNum / den.value) * 100;
                    date = num.date > den.date ? num.date : den.date;

                    console.log(`Processed ${metric.id}: num=${num.value}, den=${den.value}, scale=${scale}, result=${value.toFixed(2)}%`);
                }
            }

            if (value !== null && date) {
                updates.push({
                    metric_id: metric.id,
                    as_of_date: date,
                    value: Number(value.toFixed(2)),
                });
            } else {
                errors.push(`No data for ${metric.id}`);
            }
        } catch (e: any) {
            console.error(`Error processing ${metric.id}:`, e);
            errors.push(`Error processing ${metric.id}: ${e.message}`);
        }
    }

    // Process China Fallback
    updates.push({
        metric_id: 'CN_GFCF_GDP_PCT',
        as_of_date: new Date().toISOString().split('T')[0],
        value: CHINA_GFCF_FIXED,
    });

    let upserted = 0;
    if (updates.length > 0) {
        const { count } = await upsertObservations(supabase, updates, {
            source_ref: 'live_api:ingest-gfcf',
            is_provisional: false,
        });
        upserted = count;
    }

    return {
        ok: true,
        counts: { upserted, skipped: errors.length },
        meta: { errors, update_ids: updates.map(u => u.metric_id) }
    };
}

serveIngest('ingest-gfcf', async (_req: Request): Promise<IngestResult> => {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    const fredApiKey = Deno.env.get('FRED_API_KEY') ?? ''
    if (!fredApiKey) throw new Error('FRED_API_KEY is missing')
    return doIngestGfcf(supabase, fredApiKey)
}, { timeoutMs: 15 * 60 * 1000, retries: 3 })
