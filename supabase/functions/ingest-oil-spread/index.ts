import { createClient, SupabaseClient } from '@supabase/supabase-js'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function classifyRegime(spread: number): 'OVERSUPPLY' | 'NORMAL' | 'TIGHTENING' | 'STRESSED' | 'EXTREME' {
    if (spread > 16) return 'EXTREME';
    if (spread > 10) return 'STRESSED';
    if (spread > 5) return 'TIGHTENING';
    if (spread < -5) return 'OVERSUPPLY';
    return 'NORMAL';
}

async function logIngestion(supabase: SupabaseClient, status: string, metadata: unknown) {
    try {
        await supabase.from('ingestion_logs').insert({
            function_name: 'ingest-oil-spread',
            status,
            metadata,
            start_time: new Date().toISOString()
        });
    } catch (_e) {
        // Non-fatal — log but don't fail
        console.warn('[ingest-oil-spread] Could not write ingestion log:', _e);
    }
}

declare const Deno: any;

Deno.serve(async (_req: Request) => {
    if (_req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const eiaApiKey = Deno.env.get('EIA_API_KEY');
    if (!eiaApiKey) {
        const msg = 'EIA_API_KEY is not set in environment secrets.';
        console.error('[ingest-oil-spread]', msg);
        await logIngestion(supabase, 'FAILED', { error: msg });
        return new Response(JSON.stringify({ error: msg }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    try {
        console.log('[ingest-oil-spread] Starting oil spread ingestion...');

        // ── 1. Fetch CL1 & CL2 from EIA — last 90 days for backfill coverage
        //    Series IDs: RCLC1 = WTI Front Month, RCLC2 = WTI Second Month
        const fetchSeries = async (seriesId: string) => {
            const url = `https://api.eia.gov/v2/petroleum/pri/fut/data/?api_key=${eiaApiKey}&facets[series][]=${seriesId}&frequency=daily&data[0]=value&sort[0][column]=period&sort[0][direction]=desc&length=90`;
            console.log(`[ingest-oil-spread] Fetching ${seriesId} from EIA...`);
            const res = await fetch(url);
            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`EIA fetch failed for ${seriesId}: HTTP ${res.status} — ${errorText.slice(0, 200)}`);
            }
            const json = (await res.json()) as any;
            if (!json.response?.data || json.response.data.length === 0) {
                throw new Error(`EIA returned no data for series ${seriesId}. Check API key and quota.`);
            }
            console.log(`[ingest-oil-spread] Got ${json.response.data.length} rows for ${seriesId}`);
            return json.response.data as Array<{ period: string; value: string }>;
        };

        const [cl1Data, cl2Data] = await Promise.all([
            fetchSeries('RCLC1'),
            fetchSeries('RCLC2'),
        ]);

        // ── 2. Align both series by date
        const cl2Map = new Map<string, number>();
        for (const row of cl2Data) {
            const val = Number(row.value);
            if (!isNaN(val) && val > 0) cl2Map.set(row.period, val);
        }

        const commonData: Array<{ date: string; cl1: number; cl2: number }> = [];
        for (const r1 of cl1Data) {
            const val1 = Number(r1.value);
            if (isNaN(val1) || val1 <= 0) continue;
            const val2 = cl2Map.get(r1.period);
            if (val2 !== undefined) {
                commonData.push({ date: r1.period, cl1: val1, cl2: val2 });
            }
        }

        if (commonData.length === 0) {
            throw new Error('No overlapping dates found between CL1 and CL2 from EIA. Check series availability.');
        }

        console.log(`[ingest-oil-spread] Found ${commonData.length} aligned data points (newest: ${commonData[0].date})`);

        // ── 3. Build upsert rows for ALL aligned dates
        const now = new Date().toISOString();
        const rows = commonData.map((d, i) => {
            const spread = d.cl1 - d.cl2;
            const prev = commonData[i + 1];
            const threeDaysBack = commonData[i + 3];
            const change_1d = prev ? spread - (prev.cl1 - prev.cl2) : 0;
            const change_3d = threeDaysBack ? spread - (threeDaysBack.cl1 - threeDaysBack.cl2) : 0;

            return {
                date: d.date,
                front_price: d.cl1,
                next_price: d.cl2,
                spread,
                regime: classifyRegime(spread),
                change_1d,
                change_3d,
                computed_at: now,
                metadata: {
                    source: 'EIA',
                    cl1_series: 'RCLC1',
                    cl2_series: 'RCLC2',
                    ingested_at: now,
                },
            };
        });

        // ── 4. Upsert all rows in batches of 30
        const BATCH_SIZE = 30;
        let upsertedCount = 0;
        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
            const batch = rows.slice(i, i + BATCH_SIZE);
            const { error: dbError } = await supabase
                .from('oil_market_spread')
                .upsert(batch, { onConflict: 'date' });

            if (dbError) {
                console.error(`[ingest-oil-spread] DB upsert error (batch ${i}):`, dbError);
                throw dbError;
            }
            upsertedCount += batch.length;
        }

        const latestRow = rows[0];
        console.log(`[ingest-oil-spread] Upserted ${upsertedCount} rows. Latest: ${latestRow.date}, spread=${latestRow.spread.toFixed(2)}`);

        await logIngestion(supabase, 'success', {
            rows_upserted: upsertedCount,
            latest_date: latestRow.date,
            latest_spread: latestRow.spread,
            regime: latestRow.regime,
        });

        return new Response(JSON.stringify({
            success: true,
            rows_upserted: upsertedCount,
            date: latestRow.date,
            spread: latestRow.spread,
            regime: latestRow.regime,
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: unknown) {
        const msg = (error as Error).message ?? String(error);
        console.error('[ingest-oil-spread] Fatal error:', msg);
        await logIngestion(supabase, 'FAILED', { error: msg });
        return new Response(JSON.stringify({ error: msg }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
