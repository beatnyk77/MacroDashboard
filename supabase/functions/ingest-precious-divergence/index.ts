import { createClient } from '@supabase/supabase-js'
import { runIngestion } from '../_shared/logging.ts'
import { fetchAlphaVantageCommodity, fetchAlphaVantageFX, upsertObservations } from '../_shared/ingest_utils.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Scrape benchmark prices from Shanghai Gold Exchange (SGE)
 */
async function fetchSGEPrice(contract: string, retries = 3): Promise<number> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    let url = '';
    if (contract === 'SHAU') {
        url = 'https://www.sge.com.cn/sjzx/everjzj';
    } else if (contract === 'SHAG') {
        url = `https://www.sge.com.cn/sjzx/shanghaiAgAuto?start_date=${dateStr}&end_date=${dateStr}`;
    }

    for (let i = 0; i < retries; i++) {
        try {
            console.log(`Fetching SGE ${contract} (Attempt ${i + 1}/${retries})...`)
            const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' } })
            if (!res.ok) throw new Error(`SGE HTTP ${res.status}`)
            const html = await res.text()

            if (contract === 'SHAU') {
                const goldRegex = /SHAU[\s\S]*?td[^>]*>([\d,.]+)<[\s\S]*?td[^>]*>([\d,.]+)</i;
                const match = html.match(goldRegex);
                if (match) {
                    const p1 = parseFloat(match[1].replace(/,/g, ''));
                    const p2 = parseFloat(match[2].replace(/,/g, ''));
                    return p2 > 0 ? p2 : p1;
                }
            } else if (contract === 'SHAG') {
                const rowRegex = /<td[^>]*>\s*SHAG\s*<\/td>([\s\S]*?)<\/tr>/gi;
                const matches = [...html.matchAll(rowRegex)];
                let latestPrice = 0;
                for (const m of matches) {
                    const priceCellRegex = /<td[^>]*>[\s\S]*?<\/td>[\s\S]*?<td[^>]*>[\s\S]*?<\/td>[\s\S]*?<td[^>]*>\s*([\d,.]+)\s*<\/td>/i;
                    const pMatch = m[1].match(priceCellRegex);
                    if (pMatch) {
                        const p = parseFloat(pMatch[1].replace(/,/g, ''));
                        if (!isNaN(p) && p > 0) latestPrice = p;
                    }
                }
                if (latestPrice > 0) return latestPrice;
            }
            throw new Error(`Parse failed for ${contract}`);
        } catch (e: any) {
            console.warn(`SGE attempt ${i + 1} failed: ${e.message}`)
            if (i === retries - 1) throw e
            await new Promise(resolve => setTimeout(resolve, 2000))
        }
    }
    return 0;
}

/**
 * Precious Metals Divergence Ingestion
 * Source: AlphaVantage (Benchmark) + SGE (Shanghai)
 */
Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    const avApiKey = Deno.env.get('ALPHAVANTAGE_API_KEY')
    if (!avApiKey) {
        return new Response(JSON.stringify({ error: 'ALPHAVANTAGE_API_KEY not found' }), { status: 500 })
    }

    return runIngestion(supabase, 'ingest-precious-divergence', async (ctx) => {
        console.log('Starting Precious Metals Divergence ingestion...')

        // 1. Fetch benchmark data from AlphaVantage
        const [goldData, silverData, fxData] = await Promise.all([
            fetchAlphaVantageCommodity('GOLD', avApiKey, 'daily'),
            fetchAlphaVantageCommodity('SILVER', avApiKey, 'daily'),
            fetchAlphaVantageFX('USD', 'CNY', avApiKey)
        ])

        if (goldData.length === 0 || silverData.length === 0 || fxData.length === 0) {
            throw new Error('Missing benchmark data from AlphaVantage')
        }

        const gold_bench = goldData[0].value
        const silver_bench = silverData[0].value
        const usdcny = fxData[0].value
        const asOfDate = goldData[0].date

        // 2. Shanghai Prices (SGE)
        let gold_sge_rmb_g = await fetchSGEPrice('SHAU').catch(() => 0);
        let silver_sge_rmb_kg = await fetchSGEPrice('SHAG').catch(() => 0);

        // Fallback for Silver SGE (using internal estimate if scrape fails)
        // Note: Removing Yahoo XAGCNY fallback as requested to remove Yahoo references
        if (silver_sge_rmb_kg === 0) {
            console.warn('Silver SGE scrape failed, no fallback available (Yahoo disabled)');
        }

        // 3. Compute Spreads
        const TROY_OZ_TO_GRAMS = 31.1035
        const gold_shanghai_usd = gold_sge_rmb_g > 0 ? (gold_sge_rmb_g * TROY_OZ_TO_GRAMS) / usdcny : 0;
        const gold_spread_pct = gold_shanghai_usd > 0 ? ((gold_shanghai_usd - gold_bench) / gold_bench) * 100 : 0;

        const silver_shanghai_usd = silver_sge_rmb_kg > 0 ? ((silver_sge_rmb_kg / 1000) * TROY_OZ_TO_GRAMS) / usdcny : 0;
        const silver_spread_pct = silver_shanghai_usd > 0 ? ((silver_shanghai_usd - silver_bench) / silver_bench) * 100 : 0;

        const observations = [
            { metric_id: 'GOLD_COMEX_USD', value: gold_bench, as_of_date: asOfDate, metadata: { source: 'AlphaVantage' } },
            { metric_id: 'GOLD_SHANGHAI_USD', value: gold_shanghai_usd, as_of_date: asOfDate, metadata: { source: 'SGE/AlphaVantage' } },
            { metric_id: 'GOLD_COMEX_SHANGHAI_SPREAD_PCT', value: gold_spread_pct, as_of_date: asOfDate, metadata: { source: 'Calculated' } },
            { metric_id: 'SILVER_COMEX_USD', value: silver_bench, as_of_date: asOfDate, metadata: { source: 'AlphaVantage' } },
            { metric_id: 'SILVER_SHANGHAI_USD', value: silver_shanghai_usd, as_of_date: asOfDate, metadata: { source: 'SGE/AlphaVantage' } },
            { metric_id: 'SILVER_COMEX_SHANGHAI_SPREAD_PCT', value: silver_spread_pct, as_of_date: asOfDate, metadata: { source: 'Calculated' } }
        ].filter(o => o.value > 0);

        if (observations.length === 0) {
            throw new Error('No valid observations computed')
        }

        console.log(`Upserting ${observations.length} observations...`)
        const { count } = await upsertObservations(ctx.supabase, observations);

        return {
            rows_inserted: count,
            metadata: {
                gold_spread: gold_spread_pct,
                silver_spread: silver_spread_pct,
                date: asOfDate,
                usdcny
            }
        };
    })
});
;
