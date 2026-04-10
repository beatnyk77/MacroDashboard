import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Target mfapi.in
const MF_API_BASE = "https://api.mfapi.in/mf";

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        console.log("Starting Mutual Fund Ingestion (mfapi.in)...");

        // 1. Fetch Scheme Master List
        const listRes = await fetch(MF_API_BASE);
        if (!listRes.ok) throw new Error("Failed to fetch MF scheme list");
        const allSchemes = await listRes.json() as any[];

        console.log(`Found ${allSchemes.length} total schemes.`);

        // For MVP, we'll focus on a subset: popular fund houses or keyword matching
        // In a real prod scenario, we'd iterate through all or use a curated list.
        const keywords = ['SBI', 'HDF', 'ICICI', 'Axis', 'Nippon', 'UTI', 'Kotak', 'Aditya', 'Mirae', 'Parag Parikh', 'Quant'];
        const prioritizedSchemes = allSchemes.filter(s => 
            keywords.some(k => s.schemeName.toUpperCase().includes(k.toUpperCase())) &&
            s.schemeName.includes('Direct') && 
            s.schemeName.includes('Growth')
        ).slice(0, 50); // Fetch top 50 direct growth funds for priority houses

        console.log(`Prioritized ${prioritizedSchemes.length} schemes for sync.`);

        const ingested = [];

        for (const scheme of prioritizedSchemes) {
            try {
                // Fetch Detailed Scheme Data (Meta + NAV history)
                const detailRes = await fetch(`${MF_API_BASE}/${scheme.schemeCode}`);
                if (!detailRes.ok) continue;

                const detail = await detailRes.json();
                const meta = detail.meta;
                const dailyData = detail.data;

                if (!meta || !dailyData || dailyData.length === 0) continue;

                // A. Sync Asset Metadata
                const { data: asset, error: assetErr } = await supabase
                    .from('mutual_fund_assets')
                    .upsert({
                        scheme_code: meta.scheme_code,
                        isin: meta.isin_growth || meta.isin_reinvestment,
                        name: meta.scheme_name,
                        category: meta.category,
                        fund_house: meta.fund_house,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'scheme_code' })
                    .select()
                    .single();

                if (assetErr || !asset) {
                    console.error(`Asset Upsert failed for ${meta.scheme_name}:`, assetErr);
                    continue;
                }

                // B. Sync Latest Observations (Last 5 days to be safe)
                const last5 = dailyData.slice(0, 5);
                for (const obs of last5) {
                    // Parse date dd-mm-yyyy to yyyy-mm-dd
                    const [dd, mm, yyyy] = obs.date.split('-');
                    const isoDate = `${yyyy}-${mm}-${dd}`;

                    const { error: obsErr } = await supabase
                        .from('mutual_fund_observations')
                        .upsert({
                            asset_id: asset.id,
                            date: isoDate,
                            nav: parseFloat(obs.nav)
                        }, { onConflict: 'asset_id, date' });
                    
                    if (!obsErr) ingested.push(`${meta.scheme_code}_${isoDate}`);
                }

                // Optional: Backfill key benchmarks (1Y, 3Y, 5Y benchmarks if they exist in history)
                // We'll fetch exactly those dates if available in the large dailyData array.
                const findPastNav = (years: number) => {
                    const targetDate = new Date();
                    targetDate.setFullYear(targetDate.getFullYear() - years);
                    // Find closest date in dailyData
                    return dailyData.find((d: any) => {
                        const [dd, mm, yyyy] = d.date.split('-');
                        const dDate = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
                        return Math.abs(dDate.getTime() - targetDate.getTime()) < 86400000 * 3; // within 3 days
                    });
                };

                const pastPoints = [1, 3, 5];
                for (const p of pastPoints) {
                    const pastObs = findPastNav(p);
                    if (pastObs) {
                        const [dd, mm, yyyy] = pastObs.date.split('-');
                        const isoDate = `${yyyy}-${mm}-${dd}`;
                        await supabase
                            .from('mutual_fund_observations')
                            .upsert({
                                asset_id: asset.id,
                                date: isoDate,
                                nav: parseFloat(pastObs.nav)
                            }, { onConflict: 'asset_id, date' });
                    }
                }

            } catch (err) {
                console.error(`Failed to sync scheme ${scheme.schemeCode}:`, err);
            }
        }

        return new Response(JSON.stringify({ 
            success: true, 
            schemes_processed: prioritizedSchemes.length,
            observations_ingested: ingested.length 
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
        });
    }
});
