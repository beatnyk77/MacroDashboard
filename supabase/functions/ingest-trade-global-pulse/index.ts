import { createClient, SupabaseClient } from '@supabase/supabase-js'

declare const Deno: any;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAJOR_REPORTERS = [
    { code: "842", iso3: "USA" },
    { code: "699", iso3: "IND" },
    { code: "251", iso3: "FRA" },
    { code: "156", iso3: "CHN" },
    { code: "276", iso3: "DEU" },
    { code: "392", iso3: "JPN" },
    { code: "826", iso3: "GBR" },
    { code: "380", iso3: "ITA" },
    { code: "124", iso3: "CAN" },
    { code: "410", iso3: "KOR" },
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
            console.log(`[ingest-trade-global-pulse] Processing ${reporter.iso3}...`)
            let targetRecords: any[] = [];
            let effectiveYear = targetYear;

            const tryFetch = async (y: string, p: string) => {
                const url = `https://comtradeapi.un.org/data/v1/get/C/A/HS?reporterCode=${reporter.code}&period=${y}&cmdCode=AG2&flowCode=X&partnerCode=${p}`
                const res = await fetch(url, { headers: { 'Ocp-Apim-Subscription-Key': comtradeKey } })
                if (!res.ok) return [];
                const d = await res.json() as any;
                return d.data || [];
            }

            targetRecords = await tryFetch(targetYear, '0');
            
            // Fallback 1: partner=all for targetYear
            if (targetRecords.length === 0) {
                const allPartners = await tryFetch(targetYear, 'all');
                if (allPartners.length > 0) {
                    const agg = new Map();
                    allPartners.forEach((r: any) => {
                        const cmd = r.CmdCode || r.cmdCode;
                        const val = r.PrimaryValue || r.primaryValue || 0;
                        agg.set(cmd, (agg.get(cmd) || 0) + val);
                    });
                    targetRecords = Array.from(agg.entries()).map(([code, val]) => ({
                        CmdCode: code,
                        PrimaryValue: val,
                        ReporterCode: reporter.code,
                        Period: targetYear
                    }));
                }
            }

            // Fallback 2: Previous Year World
            if (targetRecords.length === 0) {
                targetRecords = await tryFetch(prevYear, '0');
                effectiveYear = prevYear;
            }

            // Fallback 3: Previous Year all
            if (targetRecords.length === 0) {
                const allPartners = await tryFetch(prevYear, 'all');
                if (allPartners.length > 0) {
                    const agg = new Map();
                    allPartners.forEach((r: any) => {
                        const cmd = r.CmdCode || r.cmdCode;
                        const val = r.PrimaryValue || r.primaryValue || 0;
                        agg.set(cmd, (agg.get(cmd) || 0) + val);
                    });
                    targetRecords = Array.from(agg.entries()).map(([code, val]) => ({
                        CmdCode: code,
                        PrimaryValue: val,
                        ReporterCode: reporter.code,
                        Period: prevYear
                    }));
                    effectiveYear = prevYear;
                }
            }

            if (targetRecords.length === 0) {
                console.error(`CRITICAL: No data found for ${reporter.iso3} after all fallbacks.`)
                await supabase.from('ingestion_logs').insert({
                    function_name: 'ingest-trade-global-pulse',
                    status: 'failed',
                    metadata: { 
                        iso3: reporter.iso3, 
                        year: effectiveYear, 
                        records: 0,
                        reason: 'No data after all fallbacks'
                    },
                    start_time: new Date().toISOString()
                });
                continue
            }

            console.log(`[ingest-trade-global-pulse] Found ${targetRecords.length} records for ${reporter.iso3} in ${effectiveYear}`)

            // Fetch previous year for growth calc (relative to effectiveYear)
            const growthPrevYear = String(parseInt(effectiveYear) - 1)
            const prevRecords = await tryFetch(growthPrevYear, '0');
            
            let prevMap = new Map();
            prevRecords.forEach((r: any) => prevMap.set(r.cmdCode, r.primaryValue));

            const totalExportValue = targetRecords.reduce((sum: number, r: any) => sum + (r.primaryValue || 0), 0);

            const rows = targetRecords.map((r: any, idx: number) => {
                const reporterCode = r.ReporterCode || r.reporterCode;
                const currentVal = r.PrimaryValue || r.primaryValue || 0;
                const cmdCode = r.CmdCode || r.cmdCode;
                const period = r.Period || r.period;
                
                const prevVal = prevMap.get(cmdCode) || 0;
                const growth = prevVal > 0 ? ((currentVal - prevVal) / prevVal) * 100 : 0;
                const share = totalExportValue > 0 ? (currentVal / totalExportValue) * 100 : 0;

                // Simple untapped score
                let untapped = 0;
                if (growth > 10) untapped += 40;
                if (growth > 25) untapped += 20;
                if (share < 2) untapped += 20;

                return {
                    reporter_iso3: reporter.iso3,
                    hs_code: cmdCode,
                    year: parseInt(String(period).substring(0, 4)),
                    export_value_usd: Math.round(currentVal),
                    yoy_growth_pct: parseFloat(growth.toFixed(2)),
                    share_of_total_pct: parseFloat(share.toFixed(3)),
                    untapped_score: Math.min(100, untapped + (idx % 20)),
                    fetched_at: new Date().toISOString()
                }
            })

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
            }

            // Log attempt
            await supabase.from('ingestion_logs').insert({
                function_name: 'ingest-trade-global-pulse',
                status: targetRecords.length > 0 ? 'success' : 'failed',
                metadata: { 
                    iso3: reporter.iso3, 
                    year: effectiveYear, 
                    records: targetRecords.length 
                },
                start_time: new Date().toISOString()
            });

            await delay(500); 
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
