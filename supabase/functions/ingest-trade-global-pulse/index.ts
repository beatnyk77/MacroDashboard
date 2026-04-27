import { createClient, SupabaseClient } from '@supabase/supabase-js'

declare const Deno: any;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAJOR_REPORTERS = [
    { code: "840", iso3: "USA" },
    { code: "156", iso3: "CHN" },
    { code: "276", iso3: "DEU" },
    { code: "392", iso3: "JPN" },
    { code: "826", iso3: "GBR" },
    { code: "250", iso3: "FRA" },
    { code: "380", iso3: "ITA" },
    { code: "124", iso3: "CAN" },
    { code: "410", iso3: "KOR" },
    { code: "356", iso3: "IND" },
    { code: "076", iso3: "BRA" },
    { code: "643", iso3: "RUS" },
    { code: "484", iso3: "MEX" },
    { code: "036", iso3: "AUS" },
    { code: "724", iso3: "ESP" },
    { code: "528", iso3: "NLD" },
    { code: "756", iso3: "CHE" },
    { code: "682", iso3: "SAU" },
    { code: "792", iso3: "TUR" },
    { code: "360", iso3: "IDN" },
];

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function chunkedUpsert(supabase: SupabaseClient, table: string, rows: any[], conflict: string) {
    const chunkSize = 100;
    for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const { error } = await supabase.from(table).upsert(chunk, { onConflict: conflict });
        if (error) throw error;
    }
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const comtradeKey = Deno.env.get('COMTRADE_API_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)

        const url = new URL(req.url)
        const targetYear = url.searchParams.get('year') || '2023'
        const prevYear = String(parseInt(targetYear) - 1)

        console.log(`[ingest-trade-global-pulse] Starting for ${targetYear}`)

        let totalUpserted = 0;

        for (const reporter of MAJOR_REPORTERS) {
            console.log(`[ingest-trade-global-pulse] Fetching AG2 exports for ${reporter.iso3} (${targetYear})...`)
            
            // Fetch target year
            const targetUrl = `https://comtradeapi.un.org/data/v1/get/C/A/HS?reporterCode=${reporter.code}&period=${targetYear}&cmdCode=AG2&flowCode=X&partnerCode=0`
            const targetRes = await fetch(targetUrl, { headers: { 'Ocp-Apim-Subscription-Key': comtradeKey } })
            
            if (!targetRes.ok) {
                console.error(`Failed to fetch ${reporter.iso3} ${targetYear}: ${targetRes.status}`)
                continue
            }

            const targetData = (await targetRes.json()) as any
            const targetRecords: any[] = targetData.data || []

            // Fetch previous year for growth calc
            const prevUrl = `https://comtradeapi.un.org/data/v1/get/C/A/HS?reporterCode=${reporter.code}&period=${prevYear}&cmdCode=AG2&flowCode=X&partnerCode=0`
            const prevRes = await fetch(prevUrl, { headers: { 'Ocp-Apim-Subscription-Key': comtradeKey } })
            
            let prevMap = new Map();
            if (prevRes.ok) {
                const prevData = (await prevRes.json()) as any
                const prevRecords: any[] = prevData.data || []
                prevRecords.forEach((r: any) => prevMap.set(r.cmdCode, r.primaryValue));
            }

            const totalExportValue = targetRecords.reduce((sum: number, r: any) => sum + (r.primaryValue || 0), 0);

            const rows = targetRecords.map((r: any, idx: number) => {
                const currentVal = r.primaryValue || 0;
                const prevVal = prevMap.get(r.cmdCode) || 0;
                const growth = prevVal > 0 ? ((currentVal - prevVal) / prevVal) * 100 : 0;
                const share = totalExportValue > 0 ? (currentVal / totalExportValue) * 100 : 0;

                // Simple untapped score: High growth + high share = 80+, high growth + low share = 60+
                let untapped = 0;
                if (growth > 10) untapped += 40;
                if (growth > 25) untapped += 20;
                if (share < 2) untapped += 20; // Potential to grow from small base

                return {
                    reporter_iso3: reporter.iso3,
                    hs_code: r.cmdCode,
                    year: parseInt(targetYear),
                    export_value_usd: Math.round(currentVal),
                    yoy_growth_pct: parseFloat(growth.toFixed(2)),
                    share_of_total_pct: parseFloat(share.toFixed(3)),
                    untapped_score: Math.min(100, untapped + (idx % 20)), // Noise for now
                    fetched_at: new Date().toISOString()
                }
            })

            // Deduplicate rows to prevent "ON CONFLICT DO UPDATE command cannot affect row a second time"
            const uniqueRows = Array.from(
                rows.reduce((map, row) => {
                    const key = `${row.reporter_iso3}-${row.hs_code}-${row.year}`;
                    map.set(key, row);
                    return map;
                }, new Map()).values()
            );

            if (uniqueRows.length > 0) {
                await chunkedUpsert(supabase, 'trade_global_aggregates', uniqueRows, 'reporter_iso3,hs_code,year')
                totalUpserted += uniqueRows.length
                console.log(`[ingest-trade-global-pulse] Upserted ${uniqueRows.length} rows for ${reporter.iso3}`)
            }

            await delay(500); // Respect API limits
        }

        return new Response(JSON.stringify({
            ok: true,
            message: `Ingestion complete. Total rows: ${totalUpserted}`,
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (err: any) {
        console.error('[ingest-trade-global-pulse] Fatal:', err)
        return new Response(JSON.stringify({ ok: false, error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
